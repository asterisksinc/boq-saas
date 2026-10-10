"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { ClientAuthLayout } from "@/components/client/ClientAuthLayout";

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get("projectId") || "";

    function handleContinue() {
        if (projectId) {
            router.push(`/client/onboarding?projectId=${encodeURIComponent(projectId)}`);
        } else {
            router.push("/client/onboarding");
        }
    }

    return (
        <div>
            {/* Top Logo */}
            <div style={{ marginBottom: "32px" }}>
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

            {/* Success Icon */}
            <div style={{ marginBottom: "20px" }}>
                <div
                    style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "16px",
                        backgroundColor: "#ECFDF5",
                        border: "1px solid #A7F3D0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <CheckCircle size={32} color="#059669" strokeWidth={2.2} />
                </div>
            </div>

            {/* Uppercase Eyebrow */}
            <div
                style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "#059669",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                }}
            >
                ACCOUNT CREATED
            </div>

            {/* Main Heading */}
            <h1
                style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#0F172A",
                    lineHeight: 1.25,
                    letterSpacing: "-0.02em",
                    margin: "0 0 12px 0",
                }}
            >
                You&apos;re All Set
            </h1>

            {/* Subtitle */}
            <p
                style={{
                    fontSize: "15px",
                    color: "#475569",
                    lineHeight: 1.6,
                    margin: "0 0 32px 0",
                }}
            >
                Your client portal account is active and linked to your project.
                You can now complete onboarding, review project documentation, and track commercial deliverables.
            </p>

            {/* Continue Button */}
            <button
                type="button"
                onClick={handleContinue}
                style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#2563EB",
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.15s ease",
                }}
            >
                <span>Continue to Onboarding</span>
                <ArrowRight size={16} />
            </button>
        </div>
    );
}

export default function ClientInvitationSuccessPage() {
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
                <SuccessContent />
            </Suspense>
        </ClientAuthLayout>
    );
}
